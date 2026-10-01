import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { noStore } from './admin-endpoint.decorator';
import { MediaController } from './media.controller';
import { AdminMediaService } from './media.service';
import { ProjectsController } from './projects.controller';
import { AdminProjectsService } from './projects.service';
import { FaqsController, ProcessStepsController } from './sections.controller';
import { AdminSectionsService } from './sections.service';
import { ServicesController } from './services.controller';
import { AdminServicesService } from './services.service';
import { SettingsController } from './settings.controller';

const controllers = [
  SettingsController,
  ServicesController,
  ProjectsController,
  ProcessStepsController,
  FaqsController,
  MediaController,
];

/** Endpoints protegidos para editar el contenido del sitio público (`/api/admin/*`). */
@Module({
  imports: [AuthModule],
  controllers,
  providers: [AdminServicesService, AdminProjectsService, AdminSectionsService, AdminMediaService],
})
export class AdminContentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(noStore).forRoutes(...controllers);
  }
}
