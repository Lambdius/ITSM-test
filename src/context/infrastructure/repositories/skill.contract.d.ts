declare namespace Repositories.Skill {
    interface Contract extends PublicContract {}

    interface PublicContract extends Repositories.Base.Contract<
        Entities.Skill,
        Repositories.Mappers.Skill.Types,
        "profileSkill"
    > {}

    interface QueryContract extends Pick<PublicContract, "findById" | "findMany"> {}
}
