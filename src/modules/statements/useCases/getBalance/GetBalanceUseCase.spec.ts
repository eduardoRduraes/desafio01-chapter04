import { hash } from "bcryptjs"
import { User } from "../../../users/entities/User"
import { Statement } from "../../entities/Statement"
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository"
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository"
import { GetBalanceUseCase } from "./GetBalanceUseCase"

describe("Create statement", ()=>{
  let inMemoryStatementSRepository: InMemoryStatementsRepository
  let inMemoryUserRepository: InMemoryUsersRepository
  let getBalanceUseCase: GetBalanceUseCase

  beforeEach(()=>{
    inMemoryStatementSRepository = new InMemoryStatementsRepository()
    inMemoryUserRepository = new InMemoryUsersRepository()
    getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementSRepository,inMemoryUserRepository)
  })

  const passwordHash = hash("12345678", 8)

  const makeFakeUser = Object.assign(new User(), {name:"username", email:"username@mail.com", password: passwordHash,created_at: new Date() })

  const makeFakeStatement = [
    Object.assign(new Statement(), {user_id:makeFakeUser.id, description:"Deposito salario", amount: 1500, type:"deposit",created_at:new Date("2022-04-17")}),
    Object.assign(new Statement(), {user_id:makeFakeUser.id, description:"compras mercado", amount: 100, type:"withdraw",created_at:new Date("2022-04-20")}),
    Object.assign(new Statement(), {user_id:makeFakeUser.id, description:"pagamento de internet", amount: 150, type:"withdraw",created_at:new Date("2022-04-21")}),
    Object.assign(new Statement(), {user_id:makeFakeUser.id, description:"boteco moranguinho", amount: 50, type:"withdraw",created_at:new Date("2022-05-05")}),
    Object.assign(new Statement(), {user_id:makeFakeUser.id, description:"deposito de elzimar", amount: 50, type:"deposit",created_at:new Date("2022-05-10")}),
  ]

  it("should be able to get balance", async ()=>{
    const { id } = await inMemoryUserRepository.create(makeFakeUser)
    for(let i = 0; i< makeFakeStatement.length; i++){
      await inMemoryStatementSRepository.create(makeFakeStatement[i])
    }

    const response = await getBalanceUseCase.execute({user_id: id as string})
    expect(response.statement).toHaveLength(5)
    expect(response.balance).toBe(1250)
  })
})
