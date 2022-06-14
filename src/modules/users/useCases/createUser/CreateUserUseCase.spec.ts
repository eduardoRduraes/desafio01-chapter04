import { hash } from 'bcryptjs';
import { AppError } from '../../../../shared/errors/AppError';
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "./CreateUserUseCase";


describe("Create User", ()=>{
  let createUserUseCase: CreateUserUseCase
  let inMemoryUsersRepository: InMemoryUsersRepository

  beforeEach(() =>{
      inMemoryUsersRepository = new InMemoryUsersRepository()
      createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository)
  })


  const makeFakeUser = () =>({
    name: "Eduardo R Durães",
    email: "eduardoduraes.123@mail.com",
    password: "123456789"

  })


  it("should be able to create a new user",async () => {
    const {name, email ,password} = makeFakeUser();

    const passwordHash = await hash(password, 8)

    const response = await createUserUseCase.execute({name, email, password: passwordHash})

    expect(response).toBeTruthy();
    expect(response).toHaveProperty("id");
  })

  it("should not be able to create a new user with email is already exists",async () => {
    expect(async()=>{
      const {name, email ,password} = makeFakeUser();

      await createUserUseCase.execute({name, email, password})

      await createUserUseCase.execute({name, email, password})
    }).rejects.toBeInstanceOf(AppError)
  })
})
