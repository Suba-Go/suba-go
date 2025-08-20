import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTenantDomains1750551000000 implements MigrationInterface {
  name = 'FixTenantDomains1750551000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clean up any malformed domains that might have been created during development
    // This will fix domains like "https://dummy.http://localhost:3000" to proper format

    // First, let's see if there are any malformed domains
    const malformedTenants = await queryRunner.query(`
      SELECT id, domain, name FROM tenant
      WHERE domain LIKE '%dummy.http%'
      OR domain LIKE '%https://dummy%'
      OR domain LIKE '%localhost:3000/s/%'
      OR domain LIKE '%subago.com%'
      OR (domain NOT LIKE 'https://www.%.subago.cl' AND domain NOT LIKE 'http://%.localhost:3000')
    `);

    // Fix each malformed domain
    for (const tenant of malformedTenants) {
      // Extract subdomain from name or create a clean one
      let subdomain = tenant.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);

      // If subdomain is empty, use a default
      if (!subdomain) {
        subdomain = `tenant-${tenant.id.substring(0, 8)}`;
      }

      // Build domain based on environment
      const newDomain =
        process.env.NODE_ENV === 'development'
          ? `http://${subdomain}.localhost:3000`
          : `https://www.${subdomain}.subago.cl`;

      // Update the domain
      await queryRunner.query(`UPDATE tenant SET domain = $1 WHERE id = $2`, [
        newDomain,
        tenant.id,
      ]);

      console.log(`Fixed tenant domain: ${tenant.domain} -> ${newDomain}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration is a data cleanup, so we don't need to reverse it
    // The down migration would be complex and not necessary for this fix
    console.log('Down migration not implemented for domain cleanup');
  }
}
