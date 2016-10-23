export type Role = "ou" | "hi" | "kaku" | "kin" | "gin" | "kei" | "kyo" | "fu";
export type RoleEn = "k" | "r" | "b" | "g" | "s" | "n" | "l" | "p";

export class RoleUtil{
  static roleEn2role(roleEn: RoleEn): Role{
    const map: { [key: string]: string; }  = {
      k: "ou",
      r: "hi",
      b: "kaku",
      g: "kin",
      s: "gin",
      n: "kei",
      l: "kyo",
      p: "fu",
    };
    return map[roleEn] as Role;
  }

  static role2roleEn(role: Role): RoleEn{
    const map: { [key: string]: string; }  = {
      ou: "k",
      hi: "r",
      kaku: "b",
      kin: "g",
      gin: "s",
      kei: "n",
      kyo: "l",
      fu: "p",
    };
    return map[role] as RoleEn;
  }
}
