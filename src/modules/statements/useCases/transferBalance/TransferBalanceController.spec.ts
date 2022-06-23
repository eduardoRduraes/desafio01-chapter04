import { Connection, createConnection } from "typeorm"
import request from "supertest"
import {v4 as uuidV4} from "uuid"
import {hash} from "bcryptjs"
import { app } from "../../../../app"


describe("TransferBalanceController", () => {
  let connection: Connection
  let user_id: string
  let user_received_id: string
  beforeAll(async () => {
    connection = await createConnection()
    await connection.runMigrations()
    user_id = uuidV4()
    user_received_id = uuidV4()
    const passwordHash = await hash("admin",8)
    await connection.query(
      `INSERT INTO USERS(id, name, email, password) VALUES('${user_id}','username', 'username@mail.com','${passwordHash}');
       INSERT INTO USERS(id, name, email, password) VALUES('${user_received_id}','receiveduser', 'receiveduser@mail.com','${passwordHash}');
       INSERT INTO STATEMENTS(id, user_id ,description, amount, type) VALUES('${uuidV4()}', '${user_id}' , 'Deposito pagamento', 200 , 'deposit');
       `
      )
  })

  afterAll(async () => {
    await connection.dropDatabase()
    await connection.close()
  })

  it("should be able to transfer values ​​between registered users", async () => {
    const responseToken = await request(app).post(`/api/v1/sessions`).send({
      email:"username@mail.com",
      password:"admin"
    });

    const response = await request(app).post(`/api/v1/statements/transfers/${user_received_id}`)
    .set({Authorization: `Bearer ${responseToken.body.token}`})
    .send({
      description:"Operation transfer",
      amount: 150
    });

    const balance = await request(app).get(`/api/v1/statements/balance`)
    .set({Authorization: `Bearer ${responseToken.body.token}`});


    const tokenUserReceived = await request(app).post(`/api/v1/sessions`).send({
      email:"receiveduser@mail.com",
      password:"admin"
    });

    const balanceReceived = await request(app).get(`/api/v1/statements/balance`)
    .set({Authorization: `Bearer ${tokenUserReceived.body.token}`});

    expect(response.body).toHaveProperty("id");
    expect(response.body.type).toBe("transfer");
    expect(response.body.amount).toBe(150);
    expect(balance.body.balance).toBe(50);
    expect(balanceReceived.body.balance).toBe(150);
  })
})
