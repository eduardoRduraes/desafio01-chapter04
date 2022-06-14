import { hash, compare} from "bcryptjs"
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { AuthenticateUserUseCase } from "../authenticateUser/AuthenticateUserUseCase"
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase"

describe("ShowUserProfile", () =>{
  let inMemoryUsersRepository: InMemoryUsersRepository
  let showUserProfileUseCase: ShowUserProfileUseCase
  let authenticateUserUseCase: AuthenticateUserUseCase

  beforeEach(()=>{
    inMemoryUsersRepository = new InMemoryUsersRepository()
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository)
    showUserProfileUseCase = new ShowUserProfileUseCase(inMemoryUsersRepository)
  })

  const makeFakeUser = () => ({
    name:"username",
    email:"username@mail.com",
    password:"123456789"
  })

  it("should be able to return the information of an authenticated user",async  () =>{
    const {name, email ,password} = makeFakeUser();
    const passwordHash = await hash(password, 8)
    const user = await inMemoryUsersRepository.create({name, email ,password: passwordHash})

    const response = await showUserProfileUseCase.execute(user.id as string)

    const passwordCompare = await compare(makeFakeUser().password,response.password)

    expect(response.id).toEqual(user.id)
    expect(response.name).toEqual(user.name)
    expect(response.email).toEqual(user.email)
    expect(passwordCompare).toBe(true)
  })
})
