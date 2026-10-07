declare namespace Repositories.Project {
    interface Contract extends PublicContract {}

    interface PublicContract extends Repositories.Base.Contract<
        Entities.Project,
        Repositories.Mappers.Project.Types,
        "project"
    > {}

    interface QueryContract extends Pick<PublicContract, "findById" | "findMany"> {}
}
