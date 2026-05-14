import neo4j from "neo4j-driver";
import type { Aluno, AlunoGrupoRecord, Curso, DbAuth, GrupoEstudo } from "./types.js";

export async function testaConn(): Promise<DbAuth> {
  const URI = "neo4j://localhost:7687";
  const AUTH: [string, string] = ["neo4j", "6grKSWQvHSXtwpqWWegu"];
  const DB = "neo4j";

  const driver = neo4j.driver(URI, neo4j.auth.basic(AUTH[0], AUTH[1]));
  try {
    await driver.verifyConnectivity();
    return { uri: URI, auth: AUTH, db: DB };
  } finally {
    await driver.close();
  }
}

function getDriver(dbAuth: DbAuth) {
  return neo4j.driver(dbAuth.uri, neo4j.auth.basic(dbAuth.auth[0], dbAuth.auth[1]));
}

export async function criarAluno(aluno: Aluno, dbAuth: DbAuth): Promise<void> {
  const driver = getDriver(dbAuth);
  try {
    await driver.executeQuery(
      `
      MERGE (a:Aluno {matricula: $matricula})
      ON CREATE SET a.nome = $nome_aluno, a.email = $email, a.idade = $idade
      `,
      {
        nome_aluno: aluno.nome,
        matricula: neo4j.int(aluno.matricula),
        email: aluno.email,
        idade: neo4j.int(aluno.idade)
      },
      { database: dbAuth.db }
    );
  } finally {
    await driver.close();
  }
}

export async function criarCurso(curso: Curso, dbAuth: DbAuth): Promise<void> {
  const driver = getDriver(dbAuth);
  try {
    await driver.executeQuery(
      `
      MERGE (c:Curso {nome: $nome_curso})
      ON CREATE SET c.duracao = $duracao
      `,
      {
        nome_curso: curso.nome,
        duracao: neo4j.int(curso.duracao)
      },
      { database: dbAuth.db }
    );
  } finally {
    await driver.close();
  }
}

export async function criarGrupo(grupo: GrupoEstudo, dbAuth: DbAuth): Promise<void> {
  const driver = getDriver(dbAuth);
  try {
    await driver.executeQuery(
      `
      MERGE (g:GrupoEstudo {data_criacao: datetime()})
      ON CREATE SET g.nome = $nome_grupo
      RETURN g.nome, g.data_criacao
      `,
      { nome_grupo: grupo.nome },
      { database: dbAuth.db }
    );
  } finally {
    await driver.close();
  }
}

export async function criarRelacaoAlunoGrupo(aluno: Aluno, grupo: GrupoEstudo, dbAuth: DbAuth): Promise<void> {
  const driver = getDriver(dbAuth);
  try {
    await driver.executeQuery(
      `
      MATCH (a:Aluno {matricula: $matricula}), (g:GrupoEstudo {nome: $nome_grupo})
      MERGE (a)-[:PARTICIPA_DE {data_participacao: datetime()}]->(g)
      `,
      {
        matricula: neo4j.int(aluno.matricula),
        nome_grupo: grupo.nome
      },
      { database: dbAuth.db }
    );
  } finally {
    await driver.close();
  }
}

export async function mostrarAlunoGrupoGrafo(dbAuth: DbAuth): Promise<AlunoGrupoRecord[]> {
  const driver = getDriver(dbAuth);
  try {
    const result = await driver.executeQuery(
      `
      MATCH (a:Aluno)-[:PARTICIPA_DE]->(g:GrupoEstudo)
      RETURN a.nome AS aluno_nome, a.email AS email, collect(g.nome) AS grupos
      `,
      {},
      { database: dbAuth.db }
    );

    return result.records.map((record) => ({
      aluno_nome: record.get("aluno_nome") as string,
      email: record.get("email") as string,
      grupos: record.get("grupos") as string[]
    }));
  } finally {
    await driver.close();
  }
}

export async function procurarParticipantes(nomeGrupo: string, dbAuth: DbAuth): Promise<{ grupo: string; alunos: string[] }[]> {
  const driver = getDriver(dbAuth);
  try {
    const result = await driver.executeQuery(
      `
      MATCH (a:Aluno)-[:PARTICIPA_DE]->(g:GrupoEstudo)
      WHERE g.nome = $nome_grupo
      RETURN g.nome AS grupo, collect(a.nome) AS alunos
      `,
      { nome_grupo: nomeGrupo },
      { database: dbAuth.db }
    );

    return result.records.map((record) => ({
      grupo: record.get("grupo") as string,
      alunos: record.get("alunos") as string[]
    }));
  } finally {
    await driver.close();
  }
}

export async function atualizarAluno(aluno: Aluno, dbAuth: DbAuth): Promise<void> {
  const driver = getDriver(dbAuth);
  try {
    await driver.executeQuery(
      `
      MATCH (a:Aluno {matricula: $matricula})
      SET a.nome = $nome_aluno, a.email = $email, a.idade = $idade
      RETURN a
      `,
      {
        nome_aluno: aluno.nome,
        matricula: neo4j.int(aluno.matricula),
        email: aluno.email,
        idade: neo4j.int(aluno.idade)
      },
      { database: dbAuth.db }
    );
  } finally {
    await driver.close();
  }
}

export async function atualizarGrupo(grupo: GrupoEstudo, grupoNovo: GrupoEstudo, dbAuth: DbAuth): Promise<void> {
  const driver = getDriver(dbAuth);
  try {
    await driver.executeQuery(
      `
      MATCH (g:GrupoEstudo {nome: $nome_grupo})
      SET g.nome = $novo_nome
      RETURN g
      `,
      {
        nome_grupo: grupo.nome,
        novo_nome: grupoNovo.nome
      },
      { database: dbAuth.db }
    );
  } finally {
    await driver.close();
  }
}

export async function apagarAluno(alunoMatricula: string, dbAuth: DbAuth): Promise<void> {
  const driver = getDriver(dbAuth);
  try {
    await driver.executeQuery(
      `
      MATCH (a:Aluno {matricula: $matricula})
      DETACH DELETE a
      `,
      { matricula: neo4j.int(Number(alunoMatricula)) },
      { database: dbAuth.db }
    );
  } finally {
    await driver.close();
  }
}

export async function apagarGrupo(nomeGrupo: string, dbAuth: DbAuth): Promise<void> {
  const driver = getDriver(dbAuth);
  try {
    await driver.executeQuery(
      `
      MATCH (g:GrupoEstudo {nome: $nome})
      DETACH DELETE g
      `,
      { nome: nomeGrupo },
      { database: dbAuth.db }
    );
  } finally {
    await driver.close();
  }
}

export async function apagarRelacaoAlunoGrupo(alunoNome: string, nomeGrupo: string, dbAuth: DbAuth): Promise<void> {
  const driver = getDriver(dbAuth);
  try {
    await driver.executeQuery(
      `
      MATCH (a:Aluno {nome: $aluno_nome})-[p:PARTICIPA_DE]->(g:GrupoEstudo {nome: $nome_grupo})
      DELETE p
      `,
      {
        aluno_nome: alunoNome,
        nome_grupo: nomeGrupo
      },
      { database: dbAuth.db }
    );
  } finally {
    await driver.close();
  }
}
