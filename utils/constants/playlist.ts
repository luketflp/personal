interface Track {
  title: string;
  artist: string;
  url: string;
  thumbnail: string;
}

const ptTracks: Track[] = [
  {
    title: "Tudo no Olhar/ Sem me Controlar/ Perdoa Amor",
    artist: "Marcos & Belutti",
    url: "https://www.youtube.com/watch?v=KTcZq6HbGpg",
    thumbnail: "https://i.ytimg.com/vi/KTcZq6HbGpg/hq720.jpg",
  },
  {
    title: "Um Sonhador / Não Aprendi a Dizer Adeus / Rumo a Goiânia",
    artist: "Leonardo",
    url: "https://www.youtube.com/watch?v=apT5ix3D-G0",
    thumbnail: "https://i.ytimg.com/vi/apT5ix3D-G0/hq720.jpg",
  },
  {
    title: "Aonde Quer Que Eu Vá",
    artist: "Os Paralamas do Sucesso",
    url: "https://www.youtube.com/watch?v=dIuK5nOZb2o",
    thumbnail: "https://i.ytimg.com/vi/dIuK5nOZb2o/hq720.jpg",
  },
  {
    title: "1406",
    artist: "Mamonas Assassinas",
    url: "https://www.youtube.com/watch?v=0WKHu0bNXDY",
    thumbnail: "https://i.ytimg.com/vi/0WKHu0bNXDY/hq720.jpg?sqp=-oaymwFBCNAFEJQDSFryq4qpAzMIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB8AEB-AH-CYAC0AWKAgwIABABGH8gFygVMA8=&rs=AOn4CLDpIviFcpSO2sfcdk85r4iOnxx7OA"
  },
  {
    title: "Tarja Preta part. Start Rap (Prod. Lk)",
    artist: "3030",
    url: "https://www.youtube.com/watch?v=r34EEl1WXrA",
    thumbnail: 'https://i.ytimg.com/vi/r34EEl1WXrA/hqdefault.jpg?sqp=-oaymwFBCOADEI4CSFryq4qpAzMIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB8AEB-AH-BIAC4AOKAgwIABABGE0gWShlMA8=&rs=AOn4CLC3hRrafYqvsWxXXQQ7f094feOjnQ'
  },
  {
    title: "Domingo",
    artist: "Mag",
    url: "https://www.youtube.com/watch?v=oeEsLF02TwQ",
    thumbnail: "https://i.ytimg.com/vi/oeEsLF02TwQ/hqdefault.jpg?sqp=-oaymwFBCOADEI4CSFryq4qpAzMIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB8AEB-AHUBoAC4AOKAgwIABABGGYgZihmMA8=&rs=AOn4CLDnxCQ6gsQFlm-ev1kZp1XvhReUNg"
  }
];

const esTracks: Track[] = [
  {
    title: "Me Porto Bonito",
    artist: "Bad Bunny",
    url: "https://www.youtube.com/watch?v=JY-D0D1pC_k",
    thumbnail: "https://i.ytimg.com/vi/JY-D0D1pC_k/hq720.jpg?sqp=-oaymwFBCNAFEJQDSFryq4qpAzMIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB8AEB-AG2CIACuAiKAgwIABABGHIgRChIMA8=&rs=AOn4CLDwtgWusB9jc9bNp2U0hgu6zYklRg"
  }
]

const enTracks: Track[] = [
  {
    title: "Gangsta's Paradise",
    artist: "Coolio",
    url: "https://www.youtube.com/watch?v=Tw0_qHNRAEA",
    thumbnail: "https://i.ytimg.com/vi/Tw0_qHNRAEA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLAfZl19X0QwF512yM5qdXcbu6B9Bw"
  },
  {
    title: "Die With A Smile",
    artist: "Lady Gaga, Bruno Mars",
    url: "https://www.youtube.com/watch?v=kPa7bsKwL-c",
    thumbnail: "https://i.ytimg.com/vi/kPa7bsKwL-c/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCP__7GEQfQgkh0AfV4704HTYiVUA"
  }
]

export const tracks: {
  pt: Track[]
  es: Track[]
  en: Track[]
} = {
  pt: ptTracks,
  es: esTracks,
  en: enTracks
}