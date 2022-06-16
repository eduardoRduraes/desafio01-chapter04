import request from "supertest"
import { Connection, createConnection } from "typeorm"
import { app } from "../../../../app"


describe("Create User", () => {
  let connection: Connection

  beforeAll(async () => {
    connection = await createConnection()
    await connection.runMigrations()
  })

  afterAll(async () => {
    await connection.dropDatabase()
    await connection.close()
  })

  it("should be able to create a new user", async () => {
    const response = await request(app).post("/api/v1/users")
                                       .send({
                                          name: "username",
                                          email: "username@mail.com",
                                          password: "admin"
                                       })
    expect(response.status).toBe(201)
  })

  it("should not be able to create user already exists", async () => {
    await request(app).post("/api/v1/users")
                                       .send({
                                          name: "username",
                                          email: "username@mail.com",
                                          password: "admin"
                                       })


    const response = await request(app).post("/api/v1/users")
                                       .send({
                                          name: "username",
                                          email: "username@mail.com",
                                          password: "admin"
                                       })
    expect(response.status).toBe(400)
    expect(response.body.message).toBe("User already exists")
  })

})
