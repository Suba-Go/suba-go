// Common Prisma types to replace 'any' usage

export interface PrismaWhereInput {
  [key: string]: unknown;
}

export interface PrismaSelectInput {
  [key: string]: boolean | PrismaSelectInput;
}

export interface PrismaIncludeInput {
  [key: string]: boolean | PrismaIncludeInput;
}

export interface PrismaOrderByInput {
  [key: string]: 'asc' | 'desc' | PrismaOrderByInput;
}

export interface PrismaCreateInput {
  [key: string]: unknown;
}

export interface PrismaUpdateInput {
  [key: string]: unknown;
}

export interface PrismaFindManyArgs {
  where?: PrismaWhereInput;
  select?: PrismaSelectInput;
  include?: PrismaIncludeInput;
  orderBy?: PrismaOrderByInput;
  skip?: number;
  take?: number;
}

export interface PrismaFindUniqueArgs {
  where: PrismaWhereInput;
  select?: PrismaSelectInput;
  include?: PrismaIncludeInput;
}

export interface PrismaCreateArgs {
  data: PrismaCreateInput;
  select?: PrismaSelectInput;
  include?: PrismaIncludeInput;
}

export interface PrismaUpdateArgs {
  where: PrismaWhereInput;
  data: PrismaUpdateInput;
  select?: PrismaSelectInput;
  include?: PrismaIncludeInput;
}

export interface PrismaDeleteArgs {
  where: PrismaWhereInput;
  select?: PrismaSelectInput;
  include?: PrismaIncludeInput;
}
