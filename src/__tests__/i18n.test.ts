import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);

jest.mock("i18next", () => {
  const actual: Record<string, unknown> = {
    use: jest.fn().mockReturnThis(),
    init: jest.fn().mockResolvedValue(undefined),
    changeLanguage: mockChangeLanguage,
  };
  return { __esModule: true, default: actual };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { changeLocale } = require("@/i18n") as {
  changeLocale: (locale: "ja" | "en") => Promise<void>;
};

describe("i18n", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("changeLocale", () => {
    it('changes language to "en" and stores in AsyncStorage', async () => {
      await changeLocale("en");
      expect(mockChangeLanguage).toHaveBeenCalledWith("en");
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("guiter:locale", "en");
    });

    it('changes language to "ja" and stores in AsyncStorage', async () => {
      await changeLocale("ja");
      expect(mockChangeLanguage).toHaveBeenCalledWith("ja");
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("guiter:locale", "ja");
    });
  });

  describe("module-level locale restoration", () => {
    it('changes language when stored value is "en"', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("en");
      jest.isolateModules(() => {
        require("@/i18n");
      });
      await Promise.resolve();
      await Promise.resolve();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith("guiter:locale");
      expect(mockChangeLanguage).toHaveBeenCalledWith("en");
    });

    it("does not change language when stored value is null", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      jest.isolateModules(() => {
        require("@/i18n");
      });
      await Promise.resolve();
      await Promise.resolve();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith("guiter:locale");
      expect(mockChangeLanguage).not.toHaveBeenCalled();
    });
  });
});
