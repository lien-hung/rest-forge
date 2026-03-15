import cryptoRandomString from "crypto-random-string";

function generateId() {
  return cryptoRandomString({ type: "ascii-printable", length: 15 });
}

export default generateId;