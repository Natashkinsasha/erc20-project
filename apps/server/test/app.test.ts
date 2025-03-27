import { expect } from "chai";
import { Express } from "express";
import request from "supertest";

import { createApp } from "../src/createApp";

describe("Token API", () => {
  let app: Express;

  before(() => {
    app = createApp();
  });

  describe("GET /token", () => {
    it("should return token metadata", async () => {
      const res = await request(app).get("/token");
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("name");
      expect(res.body).to.have.property("symbol");
      expect(res.body).to.have.property("totalSupply");
    });
  });

  describe("GET /balance/:address", () => {
    it("should return balance for valid address", async () => {
      const testAddress = "0xaaC412515A68ce958A5C5109a7b7195dCD7bFa13";
      const res = await request(app).get(`/balance/${testAddress}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("balance");
    });

    it("should fail for invalid address", async () => {
      const res = await request(app).get("/balance/0x123");
      expect(res.status).to.equal(500);
      console.log(res.body);
      expect(res.body).to.have.property("error");
    });
  });

  describe("POST /transferFrom", () => {
    it("should return error if body is missing", async () => {
      const res = await request(app).post("/transferFrom").send({});
      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("error");
    });

    it("should fail for invalid params", async () => {
      const res = await request(app).post("/transferFrom").send({
        from: "0x123",
        to: "0x456",
        amount: "1000",
      });
      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("error");
    });
  });

  describe("POST /mint", () => {
    it("should mint tokens to valid address", async () => {
      const to = "0xaaC412515A68ce958A5C5109a7b7195dCD7bFa13";
      const amount = "1000";

      const res = await request(app).post("/mint").send({ to, amount });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("hash");
    });

    it("should fail for invalid address", async () => {
      const res = await request(app).post("/mint").send({
        to: "0x123",
        amount: "1000",
      });
      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("error");
    });

    it("should fail for missing amount", async () => {
      const res = await request(app).post("/mint").send({
        to: "0xaaC412515A68ce958A5C5109a7b7195dCD7bFa13",
      });
      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("error");
    });

    it("should fail for non-numeric amount", async () => {
      const res = await request(app).post("/mint").send({
        to: "0xaaC412515A68ce958A5C5109a7b7195dCD7bFa13",
        amount: "not-a-number",
      });
      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("error");
    });
  });
});
