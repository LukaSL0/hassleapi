# Hassle Company API

API para e-commerce (Modelo Treino) construída em TypeScript com foco em segurança, testabilidade (JEST) e escalabilidade.

## Sumário
- [Stack](#stack)
- [Principais Recursos](#principais-recursos)
- [Arquitetura & Padrões](#arquitetura--padrões)
- [Segurança](#segurança)
- [Boas Práticas Adotadas](#boas-práticas-adotadas)

## Stack
- Runtime: Node.js (ESM)
- Linguagem: TypeScript (compilado para `dist/`)
- Framework: Express
- Banco de Dados: MongoDB (Mongoose)
- Segurança: JWT, Bcrypt, Rate Limit
- Auth 2FA: Speakeasy + QRCode
- Criptografia: CryptoJS
- Testes unitários: JEST (ts-jest)
- Email: Nodemailer (Gmail / SMTP)

## Principais Recursos
- Cadastro/Login + Confirmação por E-mail
- Recuperação e redefinição de senha
- Autenticação JWT + Middleware de autorização (Admin)
- 2FA (Google Authenticator compatível)
- Carrinho de compras
- Drops / Produtos
- Endereços criptografados
- Testes unitários para controladores (`email`, `cep`, `crypto`)

## Arquitetura & Padrões
- Separação por domínio (`routes/`, `controllers/`, `middleware/`, `db/`)
- Rotas minimalistas: Lógica delegada a controladores
- Uso de `.lean()` para queries somente leitura
- Import ESM com extensão `.js` (NodeNext)
- Cache de recursos (ex.: Transporter de e-mail)

## Segurança
- Hash de senha com `Bcrypt`
- Token JWT com expiração
- Autenticação de 2 fatos (2FA TOTP)
- Dados sensíveis criptografados
- Seleção estrita de campos (`.select`)
- Evita mutação acidental via `ReadonlyArray`

## Boas Práticas Adotadas
- Tipagem forte em handlers
- Centralização da conexão ao banco
- Erros tratados e respostas consistentes
- Funções puras para utilidades (testáveis)
- Evita lógica duplicada (middlewares reutilizáveis)
- Uso de cache para transporter de e-mail