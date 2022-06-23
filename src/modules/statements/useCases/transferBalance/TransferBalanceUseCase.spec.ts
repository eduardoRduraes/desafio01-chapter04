import { User } from '../../../users/entities/User';
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { Statement } from '../../entities/Statement';
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "../createStatement/CreateStatementError";
import { TransferBalanceUseCase } from "./TransferBalanceUseCase";


interface IRequest {
  received_id: string,
  sender_id: string,
  type: Statement["type"],
  amount: number,
  description: string
}

describe("TransferBalanceUseCase", () => {
  let inMemoryStatementSRepository: InMemoryStatementsRepository;
  let inMemoryUserRepository: InMemoryUsersRepository;
  let transferBalanceUseCase: TransferBalanceUseCase;


  beforeEach(() => {
    inMemoryStatementSRepository = new  InMemoryStatementsRepository();
    inMemoryUserRepository = new  InMemoryUsersRepository();

    transferBalanceUseCase = new  TransferBalanceUseCase(inMemoryUserRepository,inMemoryStatementSRepository);
  })

  const makeFakeSend:IRequest = {
    received_id: "received_id",
    sender_id: "sender_id",
    type: 'transfers' as Statement["type"],
    amount:150,
    description: "Balance Transfer",
  }

  const makeFakeUserSend = async():Promise<User> => {
    const user = await inMemoryUserRepository.create({name: "Eduardo R Durães",
    email: "eduardoduraes.123@mail.com",
    password: "1234"})

    return user;

  }

  const makeFakeUserReceived = async ():Promise<User> => {
    const user = await inMemoryUserRepository.create({
      name: "Eliane Ap. M",
      email: "eliane.ap.m@mail.com",
      password: "123" })

    return user;

  }

  const makeFakeStatementSend = async (user_id:string):Promise<Statement> =>{
    const statement = await inMemoryStatementSRepository.create({
      user_id,
      type: 'deposit' as Statement["type"],
      amount:100,
      description:"Deposit Operation"
    })

    return statement
  }

  const makeFakeStatementReceived = async (user_id:string):Promise<Statement> =>{
      const statement = await inMemoryStatementSRepository.create({
      user_id,
      type: 'deposit' as Statement["type"],
      amount:200,
      description:"Deposit Operation"
    })

    return statement
  }


  it("should not be able to perform this operation if the user who transfers a value does not exist!", async () => {
    await expect(
      transferBalanceUseCase.execute(makeFakeSend)
    ).rejects.toEqual(new CreateStatementError.UserNotFound())
  })

  it("!", async () => {
    const user = await makeFakeUserSend()

    makeFakeSend.sender_id = user.id as string

    await expect(
      transferBalanceUseCase.execute(makeFakeSend)
    ).rejects.toEqual(new CreateStatementError.UserNotFound())
  })

  it("should not be able to perform this operation if the user who transfers an amount has no balance", async () => {
    const user_send = await makeFakeUserSend()
    const user_received = await makeFakeUserReceived()

    makeFakeSend.sender_id = user_send.id as string
    makeFakeSend.received_id = user_received.id as string

    await makeFakeStatementSend(user_send.id as string)
    await makeFakeStatementReceived(user_received.id as string)

    await expect(
      transferBalanceUseCase.execute(makeFakeSend)
    ).rejects.toEqual(new CreateStatementError.InsufficientFunds())
  })


  it("should be able to perform a balance transfer between existing users", async () => {
    const user_send = await makeFakeUserSend()
    const user_received = await makeFakeUserReceived()

    makeFakeSend.sender_id = user_send.id as string
    makeFakeSend.received_id = user_received.id as string


    await makeFakeStatementSend(user_send.id as string)
    await makeFakeStatementSend(user_send.id as string)
    await makeFakeStatementReceived(user_received.id as string)

    const response = await transferBalanceUseCase.execute(makeFakeSend)

    const {balance: balance_send} = await inMemoryStatementSRepository.getUserBalance({user_id: user_send.id as string})
    const {balance: balance_received} = await inMemoryStatementSRepository.getUserBalance({user_id: user_received.id as string})


    expect(response).toBeTruthy()
    expect(response).toHaveProperty("id")
    expect(response.type).toBe("transfers")
    expect(response.amount).toBe(150)
    expect(balance_send).toBe(50)
    expect(balance_received).toBe(350)
  })
})
