import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ko: {
    translation: {
      "Battle Arena": "배틀 아레나",
      "Select a region to choose your Pokemon!": "포켓몬을 선택할 지역을 골라주세요!",
      "Pokemon Battle Simulator": "포켓몬 배틀 시뮬레이터",
      "Battle Setup": "배틀 준비",
      "Player 1": "플레이어 1",
      "Player 2": "플레이어 2",
      "Select below": "아래에서 선택",
      "Start Battle!": "배틀 시작!",
      "Loading Pokedex...": "도감을 불러오는 중...",
      "Play Again": "다시 플레이",
      "Wild {{name}} appeared!": "야생의 {{name}}이(가) 나타났다!",
      "Go, {{name}}!": "가랏, {{name}}!",
      "{{name}} attacks! Dealt {{damage}} damage!": "{{name}}의 공격! {{damage}}의 데미지를 입혔다!",
      "Opponent {{name}} fainted! You win!": "야생의 {{name}}은(는) 쓰러졌다! 배틀에서 이겼다!",
      "Opponent {{name}} attacks! Dealt {{damage}} damage!": "야생의 {{name}}의 공격! {{damage}}의 데미지를 입었다!",
      "{{name}} fainted! You lose!": "{{name}}은(는) 쓰러졌다! 눈앞이 깜깜해졌다...",
      "Attack": "공격",
      "Defense": "방어",
      "Speed": "스피드",
      "Region Pokedex": "{{region}} 도감"
    }
  },
  en: {
    translation: {
      "Battle Arena": "Battle Arena",
      "Select a region to choose your Pokemon!": "Select a region to choose your Pokemon!",
      "Pokemon Battle Simulator": "Pokemon Battle Simulator",
      "Battle Setup": "Battle Setup",
      "Player 1": "Player 1",
      "Player 2": "Player 2",
      "Select below": "Select below",
      "Start Battle!": "Start Battle!",
      "Loading Pokedex...": "Loading Pokedex...",
      "Play Again": "Play Again",
      "Wild {{name}} appeared!": "Wild {{name}} appeared!",
      "Go, {{name}}!": "Go, {{name}}!",
      "{{name}} attacks! Dealt {{damage}} damage!": "{{name}} attacks! Dealt {{damage}} damage!",
      "Opponent {{name}} fainted! You win!": "Opponent {{name}} fainted! You win!",
      "Opponent {{name}} attacks! Dealt {{damage}} damage!": "Opponent {{name}} attacks! Dealt {{damage}} damage!",
      "{{name}} fainted! You lose!": "{{name}} fainted! You lose!",
      "Attack": "Attack",
      "Defense": "Defense",
      "Speed": "Speed",
      "Region Pokedex": "{{region}} Pokedex"
    }
  },
  ja: {
    translation: {
      "Battle Arena": "バトルアリーナ",
      "Select a region to choose your Pokemon!": "ポケモンを選ぶ地方を選択してください！",
      "Pokemon Battle Simulator": "ポケモンバトルシミュレーター",
      "Battle Setup": "バトルの準備",
      "Player 1": "プレイヤー 1",
      "Player 2": "プレイヤー 2",
      "Select below": "下から選択",
      "Start Battle!": "バトル開始！",
      "Loading Pokedex...": "図鑑を読み込み中...",
      "Play Again": "もう一度プレイ",
      "Wild {{name}} appeared!": "野生の{{name}}が現れた！",
      "Go, {{name}}!": "ゆけっ、{{name}}！",
      "{{name}} attacks! Dealt {{damage}} damage!": "{{name}}の攻撃！{{damage}}のダメージを与えた！",
      "Opponent {{name}} fainted! You win!": "野生の{{name}}は倒れた！バトルに勝った！",
      "Opponent {{name}} attacks! Dealt {{damage}} damage!": "野生の{{name}}の攻撃！{{damage}}のダメージを受けた！",
      "{{name}} fainted! You lose!": "{{name}}は倒れた！目の前が真っ暗になった...",
      "Attack": "こうげき",
      "Defense": "ぼうぎょ",
      "Speed": "すばやさ",
      "Region Pokedex": "{{region}} 図鑑"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ko", // 기본 언어를 한국어로 설정
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // React는 이미 XSS 방어 기능이 있음
    }
  });

export default i18n;
