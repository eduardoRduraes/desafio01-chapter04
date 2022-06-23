import { inject, injectable } from "tsyringe";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { Statement } from "../../entities/Statement";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementError } from "../createStatement/CreateStatementError";

interface IRequest {
  received_id: string,
  sender_id: string,
  type: Statement["type"],
  amount: number,
  description: string
}

@injectable()
class TransferBalanceUseCase {
    constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository
  ) {}

  async execute({received_id,sender_id,type, amount,description}:IRequest):Promise<Statement>{
    const sender_user = await this.usersRepository.findById(sender_id);
    const received_user = await this.usersRepository.findById(received_id as string)

    if(!sender_user) {
      throw new CreateStatementError.UserNotFound();
    }

    if(!received_user) {
      throw new CreateStatementError.UserNotFound();
    }

    const { balance } = await this.statementsRepository.getUserBalance({user_id:sender_id});
    if(balance < amount) {
      throw new CreateStatementError.InsufficientFunds()
    }

    const statementOperation = await this.statementsRepository.create({
      user_id: sender_id,
      type,
      amount,
      description
    })

    await this.statementsRepository.create({
      user_id: received_id,
      type: "deposit" as Statement["type"],
      amount,
      description: `amount transferred by ${sender_user.name}`
    })

    return statementOperation
  }

}


export { TransferBalanceUseCase };

