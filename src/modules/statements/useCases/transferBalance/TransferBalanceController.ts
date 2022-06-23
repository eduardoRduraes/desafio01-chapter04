import { Request, Response } from "express";
import { container } from "tsyringe";
import { TransferBalanceUseCase } from "./TransferBalanceUseCase";

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  TRANSFER = 'transfer'
}


class TransferBalanceController{
  async handle(request:Request, response:Response):Promise<Response>{
    const {user_id: received_id} = request.params;
    const {id: sender_id} = request.user;
    const {amount, description} = request.body;

    const splittedPath = request.originalUrl.split('s/')
    const type = splittedPath[splittedPath.length - 2] as OperationType;

    const transferBalance = container.resolve(TransferBalanceUseCase);
    const statement = await transferBalance.execute({received_id,sender_id,type, amount,description})


    return response.status(201).json(statement)
  }
}

export { TransferBalanceController }
