import { compare, hash } from "bcrypt";

const ROUNDS = 10;

export async function hashPassword(plain: string) {
  return hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, passwordHash: string) {
  return compare(plain, passwordHash);
}
