declare namespace Fixtures.Profile {
    interface Contract extends Fixtures.Core.Contract {
        duplicateSortValuesScenario: DuplicateSortValuesScenario.Signature;
        presentationScenario: PresentationScenario.Signature;
    }

    namespace PresentationScenario {
        type Result = Promise<Entities.Profile>;

        type Signature = () => Result;
    }

    namespace DuplicateSortValuesScenario {
        type Result = Promise<{ first: Entities.Profile; second: Entities.Profile }>;

        type Signature = () => Result;
    }
}
