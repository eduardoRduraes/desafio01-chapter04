import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase"
import { compare, hash } from 'bcryptjs';
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

describe("Authenticate User", () =>{
  let authenticateUseCase: AuthenticateUserUseCase
  let inMemoryUsersRepository: InMemoryUsersRepository

  beforeEach(()=>{
    inMemoryUsersRepository = new InMemoryUsersRepository()
    authenticateUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository)
  })



  const makeFakeUser = () => ({
    name:"Eduardo R Duraes",
    email: "eduardoduraes.123@mail.com",
    password: "13245789"
  })
  const makeFakeUserAuth = () => ({
    email: "eduardoduraes.123@mail.com",
    password: "13245789"
  })

  it("should be able to authenticate a non-existent user",()=> {
    expect(async()=>{

      await authenticateUseCase.execute(makeFakeUser())

    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  })

  it("should be able verify that the password is a valid password",()=> {
    expect(async()=>{
      await inMemoryUsersRepository.create(makeFakeUser())
      await authenticateUseCase.execute(makeFakeUserAuth())

    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  })

  it("should be able to authenticate a user valid",async ()=> {
      const {name, email ,password} = makeFakeUser();
      const passwordHash = await hash(password, 8)
      await inMemoryUsersRepository.create({name, email ,password: passwordHash})
      const response = await authenticateUseCase.execute(makeFakeUserAuth())
      expect(response.user).toHaveProperty("id")
      expect(response).toHaveProperty("token")
    })

})
