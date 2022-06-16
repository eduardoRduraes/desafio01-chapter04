import { Connection, createConnection } from "typeorm"
import {hash} from  "bcryptjs"
import request from "supertest"
import { v4 as uuidV4 } from "uuid"
import { app } from "../../../../app"

describe("GetStatementOperation", () => {
  let connection: Connection
  let statement_id: string
  let user_id: string
  beforeAll(async () => {
    connection = await createConnection()
    await connection.runMigrations()
    statement_id = uuidV4()
    user_id = uuidV4()
    const passwordHash = await hash("admin",8)
    await connection.query(
      `INSERT INTO USERS(id, name, email, password) VALUES('${user_id}','username', 'username@mail.com','${passwordHash}');
       INSERT INTO STATEMENTS(id, user_id ,description, amount, type) VALUES('${statement_id}', '${user_id}' , 'Deposito pagamento', 500 , 'deposit');`
      )
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

    const response = await request(app).get(`/api/v1/statements/${statement_id}`).set(
      {Authorization: `Bearer ${responseToken.body.token}`}
    )

    expect(response.status).toBe(200)
    expect(response.body.id).toBe(statement_id)
    expect(response.body.description).toBe("Deposito pagamento")
    expect(response.body.amount).toBe("500.00")
    expect(response.body.type).toBe("deposit")
  })
})
