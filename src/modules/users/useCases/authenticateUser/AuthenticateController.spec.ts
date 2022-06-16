import { hash } from "bcryptjs"
import request from "supertest"
import { Connection, createConnection } from "typeorm"
import { v4 as uuidV4 } from "uuid"
import { app } from "../../../../app"

describe("Authenticate controller", () => {
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

  it("should be able to authenticate a user", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email:"username@mail.com",
      password:"admin"
    })

    expect(response.status).toBe(200)
    expect(response.body.user).toHaveProperty("id")
    expect(response.body).toHaveProperty("token")
  })

  it("should be able to authenticate a user with invalid password", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email:"username@mail.com",
      password:"admin1"
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe("Incorrect email or password")
  })

  it("should be able to authenticate a user with invalid email", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email:"username1@mail.com",
      password:"admin"
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe("Incorrect email or password")
  })
})
