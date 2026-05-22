import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_CREDIT_ANALYSIS_URL = Deno.env.get('API_CREDIT_ANALYSIS_URL') ||
  'https://uat-api.serasaexperian.com.br/consultas/v1/relato';
const API_CREDIT_ANALYSIS_TOKEN = Deno.env.get('API_CREDIT_ANALYSIS_TOKEN')?.trim();
const API_CREDIT_ANALYSIS_AUTH_HEADER = Deno.env.get('API_CREDIT_ANALYSIS_AUTH_HEADER')?.trim() || 'Authorization';
const API_CREDIT_ANALYSIS_AUTH_SCHEME = Deno.env.get('API_CREDIT_ANALYSIS_AUTH_SCHEME')?.trim() || 'Bearer';
const USE_MOCK_CREDIT_ANALYSIS = Deno.env.get('USE_MOCK_CREDIT_ANALYSIS') === 'true';

function createJsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Scores de mock por CPF (apenas dígitos) para cenários E2E e desenvolvimento. */
const MOCK_SCORES_BY_CPF: Record<string, number> = {
  '52998224725': 750, // score alto — aprovação automática (CT06)
  '39053344705': 600, // score médio — em análise (CT07)
  '12345678909': 420, // score baixo — reprovação (CT08/CT09)
};

function getCreditAnalysisResult(cpfClean: string) {
  const score = MOCK_SCORES_BY_CPF[cpfClean] ?? 420;

  return {
    status: 'Done',
    score,
  };
}

function buildExternalHeaders(): HeadersInit {
  if (!API_CREDIT_ANALYSIS_TOKEN) {
    return {
      'Content-Type': 'application/json',
    };
  }

  const shouldFormatAsAuthorization = API_CREDIT_ANALYSIS_AUTH_HEADER.toLowerCase() === 'authorization';
  const authValue = shouldFormatAsAuthorization && API_CREDIT_ANALYSIS_AUTH_SCHEME
    ? `${API_CREDIT_ANALYSIS_AUTH_SCHEME} ${API_CREDIT_ANALYSIS_TOKEN}`
    : API_CREDIT_ANALYSIS_TOKEN;

  return {
    'Content-Type': 'application/json',
    [API_CREDIT_ANALYSIS_AUTH_HEADER]: authValue,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cpf } = await req.json();

    if (!cpf) {
      return createJsonResponse({ error: 'CPF é obrigatório' }, 400);
    }

    // Remove máscara do CPF
    const cpfClean = cpf.replace(/\D/g, '');
    if (!/^\d{11}$/.test(cpfClean)) {
      return createJsonResponse({ error: 'CPF inválido' }, 400);
    }

    const shouldUseMock = USE_MOCK_CREDIT_ANALYSIS || !API_CREDIT_ANALYSIS_TOKEN;

    console.log(
      `Running credit analysis for CPF: ${cpfClean.substring(0, 3)}*** (${shouldUseMock ? 'mock' : 'external'})`
    );

    if (shouldUseMock) {
      return createJsonResponse(getCreditAnalysisResult(cpfClean));
    }

    // Requisição para API real
    const response = await fetch(API_CREDIT_ANALYSIS_URL, {
      method: 'POST',
      headers: buildExternalHeaders(),
      body: JSON.stringify({
        documento: cpfClean,
        tipo_documento: 'CPF',
        parametros: {
          consultar_score: true,
          exibir_negativacoes: false,
        },
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('Credit API error:', response.status, response.statusText, data);
      return createJsonResponse({ error: 'Erro na consulta de crédito' }, 502);
    }

    // Valida resposta
    const score =
      typeof data === 'object' &&
      data !== null &&
      'score' in data &&
      typeof data.score === 'number'
        ? data.score
        : null;

    if (score === null) {
      console.error('Invalid response from credit API: missing score field');
      return createJsonResponse({ error: 'Resposta inválida da API de crédito' }, 502);
    }

    const status =
      typeof data === 'object' &&
      data !== null &&
      'status' in data &&
      typeof data.status === 'string'
        ? data.status
        : 'Done';

    console.log(`Credit analysis completed. Score: ${score}`);

    return createJsonResponse({
      status,
      score,
    });

  } catch (error) {
    console.error('Credit analysis error:', error);

    return createJsonResponse({ error: 'Falha na comunicação com serviço de crédito' }, 503);
  }
});
