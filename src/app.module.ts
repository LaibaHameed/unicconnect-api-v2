import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfilesModule } from './profiles/profiles.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { GroupsModule } from './groups/groups.module';
import { EventsModule } from './events/events.module';
import { AiSummaryModule } from './ai-summary/ai-summary.module';

@Module({
  imports: [
    // ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    ProfilesModule,
    UsersModule,
    AuthModule,
    MailModule,
    GroupsModule,
    EventsModule,
    AiSummaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
