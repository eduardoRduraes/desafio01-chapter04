import { hash } from "bcryptjs"
import request from "supertest"
import { Connection, createConnection } from "typeorm"
import {v4 as uuidV4} from "uuid"
import { app } from "../../../../app"

describe("Show profile controller", () => {
  let connection: Connection

  beforeAll(async () => {
    connection = await createConnection()
    await connection.runMigrations()
    const id = uuidV4()
    const passwordHash = await hash('admin', 8)
    const query = `INSERT INTO USERS(id, name, email, password) VALUES('${id}','username', 'username@mail.com','${passwordHash}')`
    await connection.query(query)

  })

  afterAll(async () => {
    await connection.dropDatabase()
    await connection.close()
  })

  it("should be able to return the information of an authenticated user", async () =>{
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email:"username@mail.com",
      password:"admin"
    })

    const response = await request(app).get("/api/v1/profile").set({
      Authorization: `Bearer ${responseToken.body.token}`,
    })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty("id")
    expect(response.body.name).toBe("username")
    expect(response.body.email).toBe("username@mail.com")
  })

  it("should not be able to return user information without authentication", async () =>{
    const response = await request(app).get("/api/v1/profile")

    expect(response.status).toBe(401)
    expect(response.body.message).toBe("JWT token is missing!")
  })

  it("should not be able to return user information with invalid token", async () =>{
        const responseToken = await request(app).post("/api/v1/sessions").send({
      email:"username@mail.com",
      password:"admin"
    })

    const response = await request(app).get("/api/v1/profile").set({
      Authorization: `Bearer ${responseToken.body.token}`+'1',
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe("JWT invalid token!")
  })
})
