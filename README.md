# Hassle Company API

API para e-commerce (Loja de Roupas) construída em TypeScript com foco em segurança, testabilidade (JEST) e escalabilidade.

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
- Banco: MongoDB (Mongoose)
- Segurança: JWT, Bcrypt, Rate Limit
- Auth 2FA: Speakeasy + QRCode
- Criptografia: CryptoJS
- Testes: Jest (ts-jest)
- Email: Nodemailer (Gmail / SMTP)

## Principais Recursos
- Cadastro/Login + confirmação por e-mail
- Recuperação e redefinição de senha
- Autenticação JWT + middleware de autorização (Admin)
- 2FA (Google Authenticator compatível)
- Carrinho de compras
- Drops / Produtos
- Endereços criptografados
- Testes unitários para controllers utilitários (`email`, `cep`, `crypto`)

## Arquitetura & Padrões
- Separação por domínio (`routes/`, `controllers/`, `middleware/`, `db/`)
- Rotas minimalistas: lógica delegada a controllers/helpers
- Modelos Mongoose com `timestamps`
- Uso de `.lean()` para queries somente leitura
- Import ESM com extensão `.js` (NodeNext)
- Cache de recursos (ex.: transporter de e-mail)

## Segurança
- Hash de senha: Bcrypt
- Token JWT com expiração
- 2FA TOTP
- Criptografia de endereço (dados sensíveis)
- Seleção estrita de campos (`.select`)
- Evita mutação acidental via `ReadonlyArray`

## Boas Práticas Adotadas
- Tipagem forte em handlers
- Erros tratados e respostas consistentes
- Funções puras para utilidades (testáveis)
- Evita lógica duplicada (middlewares reutilizáveis)
- Uso de cache para transporter de e-mail