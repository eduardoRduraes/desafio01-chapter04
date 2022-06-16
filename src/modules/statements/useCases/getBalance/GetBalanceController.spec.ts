import { Connection, createConnection } from "typeorm"
import {hash} from  "bcryptjs"
import request from "supertest"
import { v4 as uuidV4 } from "uuid"
import { app } from "../../../../app"

describe("GetBalanceController", () => {
  let connection: Connection

  beforeAll(async () => {
    connection = await createConnection()
    await connection.runMigrations()
    const user_id = uuidV4()
    const passwordHash = await hash("admin",8)
    await connection.query(
      `INSERT INTO USERS(id, name, email, password) VALUES('${user_id}','username', 'username@mail.com','${passwordHash}');`
      )

    await connection.query(`
       INSERT INTO STATEMENTS(id, user_id ,description, amount, type) VALUES('${uuidV4()}', '${user_id}' , 'Deposito pagamento', 500 , 'deposit');
       INSERT INTO STATEMENTS(id, user_id ,description, amount, type) VALUES('${uuidV4()}', '${user_id}' , 'compras mercado', 100 , 'withdraw');
       INSERT INTO STATEMENTS(id, user_id ,description, amount, type) VALUES('${uuidV4()}', '${user_id}' , 'Deposito pagamento', 500 , 'deposit');
       INSERT INTO STATEMENTS(id, user_id ,description, amount, type) VALUES('${uuidV4()}', '${user_id}' , 'pagamento de internet', 150 , 'withdraw');
       INSERT INTO STATEMENTS(id, user_id ,description, amount, type) VALUES('${uuidV4()}', '${user_id}' , 'Deposito pagamento', 500 , 'deposit');
       INSERT INTO STATEMENTS(id, user_id ,description, amount, type) VALUES('${uuidV4()}', '${user_id}' , 'boteco moranguinho', 50 , 'withdraw');
       INSERT INTO STATEMENTS(id, user_id ,description, amount, type) VALUES('${uuidV4()}', '${user_id}' , 'Deposito de referente a manutenção de notebook', 250 , 'deposit')
       `)
  })

  afterAll(async () => {
    await connection.dropDatabase()
    await connection.close()
  })

  it("should be able to get balance", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email:"username@mail.com",
      password:"admin"
    })

    const response = await request(app).get("/api/v1/statements/balance").set(
      {Authorization: `Bearer ${responseToken.body.token}`}
    )

    expect(response.status).toBe(200)
    expect(response.body.statement).toHaveLength(7)
    expect(response.body.balance).toBe(1450)
  })

  it("should not be able to view balance without an authenticated user", async () => {
    const response = await request(app).get("/api/v1/statements/balance")

    expect(response.status).toBe(401)
    expect(response.body.message).toBe("JWT token is missing!")
  })
})
