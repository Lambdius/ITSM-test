declare namespace Repositories.Experience {
    interface Contract extends PublicContract {}

    interface PublicContract extends Repositories.Base.Contract<
        Entities.Experience,
        Repositories.Mappers.Experience.Types,
        "experience"
    > {}

    interface QueryContract extends Pick<PublicContract, "findById" | "findMany"> {}
}
