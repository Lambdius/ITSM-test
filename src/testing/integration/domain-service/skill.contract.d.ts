import { SkillRepository, ProfileRepository } from "~context/infrastructure/repositories";
import { SkillService } from "~context/domain/services/skill.service";

declare global {
    namespace Integration.Domain.Skill {
        interface Contract {
            repositories: Repositories.Signature;
            service: Service.Signature;
        }

        namespace Service {
            type Context = {
                repositories: Repositories.Context;
                skillService: SkillService;
            };

            type Signature = (context: Integration.Postgres.Suite.FactoryContext) => Context;
        }

        namespace Repositories {
            type Context = {
                profiles: ProfileRepository;
                skills: SkillRepository;
            };

            type Signature = (context: Integration.Postgres.Suite.FactoryContext) => Context;
        }
    }
}
