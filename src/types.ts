export interface Aluno {
  nome: string;
  matricula: number;
  email: string;
  idade: number;
}

export interface Curso {
  nome: string;
  duracao: number;
}

export interface GrupoEstudo {
  nome: string;
}

export interface DbAuth {
  uri: string;
  auth: [string, string];
  db: string;
}

export interface AlunoGrupoRecord {
  aluno_nome: string;
  email: string;
  grupos: string[];
}
