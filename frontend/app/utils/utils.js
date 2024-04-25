export function formatNumberWithSign(number) {
    if (number > 0) {
        return '+' + number;
    } else {
        return number.toString();
    }
}