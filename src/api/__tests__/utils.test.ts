import { describe, it, expect } from "vitest";
import { decodeBasicAuth } from "../utils";

describe("decodeBasicAuth", () => {
    it("returns null for undefined header", () => {
        expect(decodeBasicAuth(undefined)).toBeNull();
    });

    it("returns null for non-Basic scheme", () => {
        expect(decodeBasicAuth("Bearer sometoken")).toBeNull();
    });

    it("returns null when decoded value has no colon", () => {
        const noColon = Buffer.from("usernameonly").toString("base64");
        expect(decodeBasicAuth(`Basic ${noColon}`)).toBeNull();
    });

    it("correctly decodes username and password", () => {
        const token = Buffer.from("alice:secret123").toString("base64");
        expect(decodeBasicAuth(`Basic ${token}`)).toEqual({ username: "alice", password: "secret123" });
    });

    it("handles password containing colons", () => {
        const token = Buffer.from("alice:pass:with:colons").toString("base64");
        expect(decodeBasicAuth(`Basic ${token}`)).toEqual({ username: "alice", password: "pass:with:colons" });
    });

    it("handles empty password", () => {
        const token = Buffer.from("alice:").toString("base64");
        expect(decodeBasicAuth(`Basic ${token}`)).toEqual({ username: "alice", password: "" });
    });
});
