import { Migration } from '@mikro-orm/migrations';

export class Migration20250327225159 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`users\` (\`id\` integer not null primary key autoincrement, \`name\` varchar not null, \`username\` varchar not null, \`email\` varchar not null, \`password\` varchar not null, \`confirmed\` boolean not null default false, \`credentials_version\` integer not null default 0, \`credentials_last_password\` text not null default '', \`credentials_password_updated_at\` integer not null default 1743115919, \`credentials_updated_at\` integer not null default 1743115919, \`created_at\` datetime not null, \`updated_at\` datetime not null);`);

    this.addSql(`create table \`oauth_providers\` (\`provider\` text check (\`provider\` in ('local', 'google', 'facebook')) not null, \`user_id\` integer not null, \`created_at\` datetime not null, \`updated_at\` datetime not null, constraint \`oauth_providers_user_id_foreign\` foreign key(\`user_id\`) references \`users\`(\`id\`) on delete cascade on update cascade, primary key (\`provider\`, \`user_id\`));`);
    this.addSql(`create index \`oauth_providers_user_id_index\` on \`oauth_providers\` (\`user_id\`);`);
    this.addSql(`create unique index \`oauth_providers_provider_user_id_unique\` on \`oauth_providers\` (\`provider\`, \`user_id\`);`);
  }

}
