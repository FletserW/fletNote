# fletNote

# 📊 Sistema de Gestão Financeira e Controle de Folgas

Sistema completo para **controle financeiro pessoal** integrado com **gestão de folgas**, permitindo organização de gastos, planejamento por categorias, acompanhamento de metas financeiras e visualização clara de dias de trabalho e descanso.

---

## 🚀 Funcionalidades Principais

* Controle financeiro detalhado (entradas, saídas e saldo)
* Orçamentos por categoria com alertas inteligentes
* Relatórios visuais (diário, mensal e anual)
* Sistema de metas financeiras (cofre)
* Controle avançado de folgas com estatísticas
* Sincronização de dados local e na nuvem
* Contas individuais com isolamento de dados

---

## 🧑‍💻 Sistema de Usuários

* Contas individuais por usuário
* Dados totalmente isolados por conta
* Autenticação de usuários
* Armazenamento de dados:

  * ☁️ **Nuvem:** Firestore Database
  * 💻 **Local:** Cookies do navegador
* Sincronização automática entre dispositivos

---

## 💰 Controle Financeiro

### ➕➖ Lançamentos Financeiros

* Registro de **ganhos (entradas)** e **gastos (saídas)**
* Lançamentos diários de transações
* Cada lançamento contém:

  * Valor
  * Data
  * Categoria personalizada
  * Tipo (entrada ou saída)

---

### 📂 Categorias Personalizadas

* Criação de categorias pelo usuário
* Cada transação pertence a uma categoria
* Extrato financeiro organizado por categoria

---

### 📊 Orçamento por Categoria

* Definição de limite de gastos por categoria
* Orçamentos configuráveis por período:

  * Mensal (padrão)
  * Anual
  * Personalizado
* Cada orçamento apresenta:

  * Valor máximo
  * Valor gasto
  * Valor restante
  * Percentual de uso

---

#### 📈 Acompanhamento de Orçamento

* Barra de progresso visual por categoria
* Status do orçamento:

  * Dentro do limite
  * Próximo do limite
  * Limite ultrapassado
* Atualização automática conforme novos gastos

---

#### 🚨 Alertas de Orçamento

* Aviso ao se aproximar do limite
* Alerta ao ultrapassar o orçamento
* Percentual de aviso configurável pelo usuário

---

#### 📅 Histórico e Comparações

* Comparação entre:

  * Valor orçado
  * Valor gasto
  * Diferença (economia ou excesso)
* Histórico mensal por categoria

---

### 📈 Saldo e Totais

* Saldo atual disponível
* Total de ganhos:

  * Mensal
  * Anual
* Total de gastos:

  * Mensal
  * Anual
* Valor restante ao final de cada mês

---

### 📅 Extrato Financeiro

* Extrato diário com:

  * Total de entradas do dia
  * Total de saídas do dia
  * Resultado diário (positivo ou negativo)
* Histórico completo de transações
* Indicação do impacto de cada gasto no orçamento da categoria

---

## 📊 Relatórios e Comparações Visuais

### 🧾 Dashboard Mensal

* Visão geral do mês:

  * Total de entradas
  * Total de saídas
  * Comparação visual entre ganhos e gastos
* Status dos orçamentos por categoria

---

### 📆 Comparativo Diário

* Para cada dia:

  * Entradas
  * Saídas
  * Indicação visual de dia positivo ou negativo

---

### 📊 Visão Anual

* Comparação entre todos os meses do ano
* Exibe:

  * Entradas por mês
  * Saídas por mês
* Destaque para:

  * Mês com maior economia
  * Mês com maior gasto
* Comparativo entre orçamento planejado e gasto real

---

## 🎯 Sistema de Metas Financeiras (Cofre)

* Criação de metas financeiras com:

  * Nome da meta
  * Valor objetivo
* Sistema de cofre:

  * Adicionar valores
  * Remover valores
* Barra de progresso visual da meta
* Valor da meta separado do saldo principal
* Possibilidade de direcionar economias do orçamento para o cofre

---

## 🗓️ Controle de Folgas

### 🔁 Tipos de Folga

* **Folgas fixas:** dias fixos da semana
* **Folgas variáveis:** a cada X dias
* **Folgas extras:** adicionadas manualmente

---

### 🎨 Configuração de Folgas

* Cada tipo de folga possui:

  * Nome personalizável
  * Cor personalizada
* Diferenciação visual no calendário

---

### 📆 Marcação de Folgas

* Seleção manual de datas
* Marcação automática como folga extra
* Visualização clara no calendário

---

### 📊 Estatísticas de Folgas

* Total de folgas no período
* Total de dias úteis
* Total de folgas extras
* Estatísticas separadas por tipo de folga

---

## 🧠 Resumo Geral

* 📌 Controle financeiro completo
* 📌 Planejamento por categorias
* 📌 Relatórios visuais (diário, mensal e anual)
* 📌 Sistema de metas com progresso visual
* 📌 Controle avançado de folgas
* 📌 Dados seguros e sincronizados (local + nuvem)

---

## 🛠️ Tecnologias Utilizadas *(exemplo – ajuste se necessário)*

* Frontend: *(React / Vue / Angular / outro)*
* Backend / Database: **Firebase Firestore**
* Autenticação: Firebase Auth
* Armazenamento local: Cookies / LocalStorage

---

## 📄 Licença

Este projeto está sob a licença **MIT**.
Sinta-se à vontade para usar, modificar e contribuir 🚀

---


