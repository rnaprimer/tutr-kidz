import { useEffect } from "react";
import { Platform } from "react-native";

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = title || "Tutr Kidz";
    }
  }, [title]);
}
