import { getMembersForEmail } from "../actions";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    tblMitglieder: {
      findMany: jest.fn(),
    },
  },
}));

const prismaMock = prisma as any;

describe("getMembersForEmail", () => {
  it("should return valid members with emails", async () => {
    const mockMembers = [
      { ID: 1, Vorname: "Max", Nachname: "M", EMail: "max@test.de" },
      { ID: 2, Vorname: "No", Nachname: "Email", EMail: "" },
      { ID: 3, Vorname: "Invalid", Nachname: "Email", EMail: "invalid" },
    ];
    prismaMock.tblMitglieder.findMany.mockResolvedValue(mockMembers);

    const result = await getMembersForEmail();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].EMail).toBe("max@test.de");
  });

  it("should return error on failure", async () => {
    prismaMock.tblMitglieder.findMany.mockRejectedValue(new Error("DB Error"));
    
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await getMembersForEmail();
    consoleSpy.mockRestore();

    expect(result.success).toBe(false);
  });
});
