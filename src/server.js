import { PrismaClient } from '@prisma/client'
import express from 'express'
import { StatusCodes } from 'http-status-codes'

const prisma = new PrismaClient()

const app = express()
app.use(express.json())

const port = 3000

// Rota que lista todos os usuários cadastrados
app.get('/users', async (_, res) => {
	const allUsers = await prisma.users.findMany()

	res.status(StatusCodes.OK).json(allUsers)
})

// Rota que lista usuário(s) por nome
app.get('/users-first-name/:firstName', async (req, res) => {
	const { firstName } = req.params

	const allUsers = await prisma.users.findMany()

	const usersWithThisFirstName = allUsers.filter(
		(user) => user.name.split(' ')[0] === firstName.toUpperCase()
	)

	if (!usersWithThisFirstName[0]) {
		return res
			.status(StatusCodes.NOT_FOUND)
			.json({ mensagem: 'Nenhum usuário encontrado com este primeiro nome.' })
	}

	res.status(StatusCodes.OK).json(usersWithThisFirstName)
})

// Rota que lista usuário por email
app.get('/users-email/:email', async (req, res) => {
	const { email } = req.params
	const formatedEmail = email.toLowerCase()

	const user = await prisma.users.findUnique({
		where: {
			email: formatedEmail
		}
	})

	if (!user) {
		return res
			.status(StatusCodes.NOT_FOUND)
			.json({ mensagem: 'Nenhum usuário encontrado com este email.' })
	}

	res.status(StatusCodes.OK).json(user)
})

// Rota para criar novo usuário
app.post('/users', async (req, res) => {
	const { name, age, email, phoneNumber } = req.body
	const formatedEmail = email.toLowerCase()

	const emailExists = await prisma.users.findUnique({
		where: {
			email: formatedEmail
		}
	})
	const phoneNumberExists = await prisma.users.findUnique({
		where: {
			phoneNumber
		}
	})

	if (emailExists) {
		return res
			.status(StatusCodes.CONFLICT)
			.json({ message: 'Email já cadastrado no sistema!' })
	}
	if (phoneNumberExists) {
		return res
			.status(StatusCodes.CONFLICT)
			.json({ message: 'Número de telefone já cadastrado no sistema!' })
	}

	const newUser = await prisma.users.create({
		data: {
			name: name.toUpperCase(),
			age,
			email: email.toLowerCase(),
			phoneNumber
		}
	})

	res.status(StatusCodes.CREATED).json(newUser)
})

// Rota para deletar usuário
app.delete('/users/:id', async (req, res) => {
	const { id } = req.params

	try {
		await prisma.users.delete({
			where: {
				id
			}
		})
	} catch (error) {
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			mensagem: 'Erro! Tente novamente.'
		})
	}

	res.status(StatusCodes.OK).json({ mensagem: 'Usuário deletado com sucesso!' })
})

// Rota para atualizar os dados do usuário
app.put('/users/:id', async (req, res) => {
	const { id } = req.params

	try {
		const user = await prisma.users.findUnique({
			where: {
				id
			}
		})

		if (!user) {
			throw new Error()
		}
	} catch (error) {
		return res.status(StatusCodes.NOT_FOUND).json({
			mensagem: 'Usuário não encontrado! Verifique os dados e tente novamente.'
		})
	}

	const { name, age, email, phoneNumber } = req.body

	const allUsers = await prisma.users.findMany()
	const usersWithoutThisUser = allUsers.filter((user) => user.id !== id)

	const emailExists = usersWithoutThisUser.findIndex(
		(user) => user.email === email.toLowerCase()
	)
	const phoneNumberExists = usersWithoutThisUser.findIndex(
		(user) => user.phoneNumber === phoneNumber
	)

	if (emailExists >= 0) {
		return res
			.status(StatusCodes.BAD_REQUEST)
			.json({ mensagem: 'Email já cadastrado no sistema!' })
	}
	if (phoneNumberExists >= 0) {
		return res
			.status(StatusCodes.BAD_REQUEST)
			.json({ mensagem: 'Número de telefone já cadastrado no sistema!' })
	}

	await prisma.users.update({
		where: {
			id
		},
		data: {
			name: name.toUpperCase(),
			age,
			email: email.toLowerCase(),
			phoneNumber
		}
	})

	res
		.status(StatusCodes.OK)
		.json({ mensagem: 'Dados atualizados com sucesso!' })
})

app.listen(port, () => console.log(`App is running on port ${port}... 🚀`))
