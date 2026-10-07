declare namespace Repositories.Profile {
    interface Contract extends PublicContract {}

    interface PublicContract extends Repositories.Base.Contract<
        Entities.Profile,
        Repositories.Mappers.Profile.Types,
        "profile"
    > {}

    interface QueryContract extends Pick<PublicContract, "findById" | "findMany"> {}
}
