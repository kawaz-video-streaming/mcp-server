import { isNil } from "ramda";
import { AuthCredentials } from "./types";

export const decodeBasicAuth = (header?: string): AuthCredentials | null => {
    if (isNil(header) || !header.startsWith("Basic ")) {
        return null;
    }
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const colon = decoded.indexOf(":");
    if (colon === -1) {
        return null;
    }
    return { username: decoded.slice(0, colon), password: decoded.slice(colon + 1) };
};