// Other filter can be futher can be added
export interface VideoFilterPresent{
    id: 'none' | 'cinematic' | 'vintage' | 'noir' | 'Retro-90',
    label: string,
    ffmpeg: string[],
}

export const VIDEO_FILTERS: VideoFilterPresent[] = [
    {
        id: 'none',
        label: "None",
        ffmpeg: [],
    },
     {
        id: 'cinematic',
        label: "Cinematic",
         ffmpeg: [
            "eq=contrast=1.1:saturation=0.9:brightness=-0.02"
        ],
    },
     {
        id: 'vintage',
        label: "Vintage",
         ffmpeg: [
      "eq=saturation=0.7:contrast=0.95:brightness=0.03"
        ],
    },
     {
        id: 'noir',
        label: "Noir",
         ffmpeg: [
      "hue=s=0",
      "eq=contrast=1.2"
        ],
    },
        {
  id: "retro90s",
  label: "90s Retro",
  ffmpeg: [
    "eq=saturation=1.3:contrast=1.1:brightness=0.03",
    "noise=alls=6:allf=t",
    "gblur=sigma=0.3"
  ],

    }
]