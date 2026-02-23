import { setCurrentMeisterschaft } from "../set-current-meisterschaft";
import { prisma } from "@/lib/prisma";
import { getComputerInfo } from "@/utils/get-computer-info";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    tblSettings: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("@/utils/get-computer-info", () => ({
  getComputerInfo: jest.fn(),
}));

const prismaMock = prisma as any;

describe("setCurrentMeisterschaft", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getComputerInfo as jest.Mock).mockReturnValue("TestPC");
  });

  it("should update existing setting", async () => {
    prismaMock.tblSettings.findFirst.mockResolvedValue({ ID: 1 });

    await setCurrentMeisterschaft({} as any, "2024");

    expect(prismaMock.tblSettings.update).toHaveBeenCalledWith({
      where: { ID: 1 },
      data: { Parameterwert: "2024" },
    });
  });

  it("should create new setting if none exists", async () => {
    prismaMock.tblSettings.findFirst.mockResolvedValue(null);

    await setCurrentMeisterschaft({} as any, "2024");

    expect(prismaMock.tblSettings.create).toHaveBeenCalledWith({
      data: {
        Computername: "TestPC",
        Parametername: "AktiveMeisterschaft",
        Parameterwert: "2024",
      },
    });
  });
});
