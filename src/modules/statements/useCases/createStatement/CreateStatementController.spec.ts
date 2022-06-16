import { Connection, createConnection } from "typeorm"
import {hash} from  "bcryptjs"
import request from "supertest"
import { v4 as uuidV4 } from "uuid"
import { app } from "../../../../app"

describe("Create statement", () => {
  let connection: Connection
  let user_id: string
  beforeAll(async () => {
    connection = await createConnection()
    await connection.runMigrations()
    user_id = uuidV4()
    const passwordHash = await hash("admin",8)
    await connection.query(
      `INSERT INTO USERS(id, name, email, password) VALUES('${user_id}','username', 'username@mail.com','${passwordHash}');`
      )
  })

  beforeEach(async () =>{
    await connection.query('DELETE FROM STATEMENTS')
  })


  afterAll(async () => {
    await connection.dropDatabase()
    await connection.close()
  })

  it("should be able to make a new deposit", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email:"username@mail.com",
      password:"admin"
    })

    const response = await request(app).post("/api/v1/statements/deposit").set(
      {Authorization: `Bearer ${responseToken.body.token}`}
    ).send({
      description: "Deposit",
      amount: 500
    })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("id")
    expect(response.body.description).toBe("Deposit")
    expect(response.body.amount).toBe(500)
  })

  it("should be able to make a new withdraw", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email:"username@mail.com",
      password:"admin"
    })

    await connection.query(`INSERT INTO STATEMENTS(id, user_id, description, amount, type) VALUES('${uuidV4()}', '${user_id}', 'Deposit', (300.50), 'deposit')`)

    const response = await request(app).post("/api/v1/statements/withdraw").set(
      {Authorization: `Bearer ${responseToken.body.token}`}
    ).send({
      description: "Withdraw",
      amount: 250
    })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("id")
    expect(response.body.description).toBe("Withdraw")
    expect(response.body.amount).toBe(250)

  })

  it("should not be able to make a new withdrawal with no available balance", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email:"username@mail.com",
      password:"admin"
    })

    const response = await request(app).post("/api/v1/statements/withdraw").set(
      {Authorization: `Bearer ${responseToken.body.token}`}
    ).send({
      description: "Withdraw",
      amount: 250
    })
    const statement = await connection.query('select * from statements')
    console.log(response.status, response.body)

    expect(response.status).toBe(400)
    expect(response.body.message).toBe("Insufficient funds")
  })

  it("should not be able to make a new deposit without an authenticated user", async () => {
     const response = await request(app).post("/api/v1/statements/deposit").send({
      description: "Deposit",
      amount: 500
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe("JWT token is missing!")
  })

  it("should not be able to make a new withdraw without an authenticated user", async () => {
    const response = await request(app).post("/api/v1/statements/withdraw").send({
      description: "Deposit",
      amount: 500
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe("JWT token is missing!")
  })

  it("should not be able to make a new deposit with invalid token", async () => {
     const response = await request(app).post("/api/v1/statements/deposit").set(
      {Authorization: `Bearer fdsafae4618673423qer864631`}
    ).send({
      description: "Deposit",
      amount: 500
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe("JWT invalid token!")
  })

  it("should not be able to make a new withdraw with invalid token", async () => {
    const response = await request(app).post("/api/v1/statements/withdraw").set(
      {Authorization: `Bearer fdsafae4618673423qer864631`}
    ).send({
      description: "Deposit",
      amount: 500
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe("JWT invalid token!")
  })
})
