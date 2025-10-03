// Assets/0.2 Scripts/PointSystem/PointManager.cs
using UnityEngine;
using UnityEngine.UI;

public class PointManager : MonoBehaviour
{
    public static PointManager instance;

    [Header("UI - Puntaje actual")]
    public Text scoreTextP1;
    public Text scoreTextP2;

    [Header("UI - High Score (opcional)")]
    public Text highTextP1;  // puedes dejar null si no lo muestras en HUD
    public Text highTextP2;  // puedes dejar null si no lo muestras en HUD

    private int scoreP1 = 0;
    private int scoreP2 = 0;

    private const string KEY_HIGH_P1 = "HighScoreP1";
    private const string KEY_HIGH_P2 = "HighScoreP2";

    void Awake()
    {
        if (instance == null) instance = this;
        else if (instance != this) { Destroy(gameObject); return; }
        // Si quisieras que sobreviva entre escenas:
        // DontDestroyOnLoad(gameObject);
    }

    void Start()
    {
        // Muestra 0–0 al iniciar e imprime los highs guardados (si tienes textos para ello)
        UpdateCurrentScoreUI();
        LoadHighscoresToUI();
    }

    // === API pública para sumar puntos ===
    public void AddPointToP1()
    {
        scoreP1++;
        UpdateCurrentScoreUI();
        SaveHighIfBeaten(1, scoreP1);
        LoadHighscoresToUI(); // refresca HUD si muestras highs
    }

    public void AddPointToP2()
    {
        scoreP2++;
        UpdateCurrentScoreUI();
        SaveHighIfBeaten(2, scoreP2);
        LoadHighscoresToUI(); // refresca HUD si muestras highs
    }

    // === Reset local de puntajes actuales (no borra highs) ===
    public void ResetCurrentScores()
    {
        scoreP1 = 0;
        scoreP2 = 0;
        UpdateCurrentScoreUI();
    }

    // === Borra highs guardados (útil para botón de menú) ===
    public void ResetHighscores()
    {
        PlayerPrefs.DeleteKey(KEY_HIGH_P1);
        PlayerPrefs.DeleteKey(KEY_HIGH_P2);
        PlayerPrefs.Save();
        LoadHighscoresToUI();
    }

    // === Internos ===
    private void UpdateCurrentScoreUI()
    {
        if (scoreTextP1) scoreTextP1.text = "Player 2: " + scoreP1;
        if (scoreTextP2) scoreTextP2.text = "Player 1: " + scoreP2;
    }

    private void SaveHighIfBeaten(int player, int current)
    {
        if (player == 1)
        {
            int best = PlayerPrefs.GetInt(KEY_HIGH_P1, 0);
            if (current > best)
            {
                PlayerPrefs.SetInt(KEY_HIGH_P1, current);
                PlayerPrefs.Save();
            }
        }
        else
        {
            int best = PlayerPrefs.GetInt(KEY_HIGH_P2, 0);
            if (current > best)
            {
                PlayerPrefs.SetInt(KEY_HIGH_P2, current);
                PlayerPrefs.Save();
            }
        }
    }

    private void LoadHighscoresToUI()
    {
        int high1 = PlayerPrefs.GetInt(KEY_HIGH_P1, 0);
        int high2 = PlayerPrefs.GetInt(KEY_HIGH_P2, 0);

        if (highTextP1) highTextP1.text = "High SCORE P2: " + high1;
        if (highTextP2) highTextP2.text = "High SCORE P1: " + high2;
    }
}
