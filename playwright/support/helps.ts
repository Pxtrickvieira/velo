export function generateOrderCode() {
    const PREFIX = "VLO-";
    const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let randomCode = "";

    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
        randomCode += CHARACTERS[randomIndex];
    }

    return PREFIX + randomCode;
}
