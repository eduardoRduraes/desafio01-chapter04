import { hash } from "bcryptjs"
import { User } from "../../../users/entities/User"
import { Statement } from "../../../statements/entities/Statement"
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository"
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository"
import { CreateStatementUseCase } from "./CreateStatementUseCase"
import { CreateStatementError } from "./CreateStatementError"

describe("Create statement", ()=>{
  let inMemoryStatementSRepository: InMemoryStatementsRepository
  let inMemoryUserRepository: InMemoryUsersRepository
  let createStatementUseCase: CreateStatementUseCase

  beforeEach(()=>{
    inMemoryStatementSRepository = new InMemoryStatementsRepository()
    inMemoryUserRepository = new InMemoryUsersRepository()
    createStatementUseCase = new CreateStatementUseCase(inMemoryUserRepository,inMemoryStatementSRepository)
  })

  const passwordHash = hash("12345678", 8)

  const makeFakeUser = Object.assign(new User(), {name:"username", email:"username@mail.com", password: passwordHash})

  const makeFakeStatement = [
    {user_id:makeFakeUser.id, description:"Deposito salario", amount: 1500, type:"deposit"},
    {user_id:makeFakeUser.id, description:"compras mercado", amount: 100, type:"withdraw"},
    {user_id:makeFakeUser.id, description:"pagamento de internet", amount: 150, type:"withdraw"},
    {user_id:makeFakeUser.id, description:"boteco moranguinho", amount: 50, type:"withdraw"},
    {user_id:makeFakeUser.id, description:"deposito de elzimar", amount: 50, type:"deposit"},
  ]

  it("should be able to create a new deposit statement", async ()=>{
    await inMemoryUserRepository.create(makeFakeUser)

    const response = await createStatementUseCase.execute(makeFakeStatement[4] as Statement)
    expect(response).toHaveProperty("id")
    expect(response.user_id).toBe(makeFakeUser.id)
    expect(response.type).toBe("deposit")
    expect(response.amount).toBe(50)

  })

  it("should be able to create a withdraw statement", async ()=>{
    await inMemoryUserRepository.create(makeFakeUser)

    await createStatementUseCase.execute(makeFakeStatement[0] as Statement)

    const response = await createStatementUseCase.execute(makeFakeStatement[2] as Statement)
    expect(response).toHaveProperty("id")
    expect(response.user_id).toBe(makeFakeUser.id)
    expect(response.type).toBe("withdraw")
    expect(response.amount).toBe(150)

  })

  it("not be able to make a withdrawal or deposit without a registered user",async ()=>{
    expect(async () => {
      await createStatementUseCase.execute(makeFakeStatement[1] as Statement)
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound)
  })

  it("should not be able to make a withdrawal without balance", () =>{
    expect(async () => {
      await inMemoryUserRepository.create(makeFakeUser)
      await createStatementUseCase.execute(makeFakeStatement[2] as Statement)
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds)
  })
})
