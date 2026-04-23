namespace Rulesage.DslRetrieval.Utils;

public static class DslRetrievalUtils
{
    public static float ComputeLevelFactor(float entryLevel, float targetLevel, float levelAlignmentSigma)
    {
        var diff = entryLevel - targetLevel;
        return MathF.Exp(-(diff * diff) / (2 * levelAlignmentSigma * levelAlignmentSigma));
    }

    public static float ComputeDecayFactor(float averageIdf, float idfPenaltyBeta)
    {
        return 1.0f / (1.0f + idfPenaltyBeta * averageIdf);
    }
}