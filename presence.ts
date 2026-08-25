import { ActivityType, Assets } from 'premid'

const presence = new Presence({
  clientId: '1530852427182374932',
})

const browsingTimestamp = Math.floor(Date.now() / 1000)

const enum ActivityAssets {
  Logo = 'https://r2.e-z.host/e0431dc3-12da-4bbd-8491-f82d2b71ae13/hebhnyhdvtmorp4.png',
  Areena = 'https://images.cdn.yle.fi/image/upload/c_scale,h_512,w_512/yle-areena-app.png',
  Abitreenit = 'https://images.cdn.yle.fi/image/upload/c_fill,h_512,w_512/v1729001167/69-site-abitreenit-share-v1.jpg',
}

function getMediaTitle(): string {
  return (
    navigator.mediaSession?.metadata?.title
    || document.querySelector('h1')?.textContent?.trim()
    || document.title.replace(/\s*\|\s*Yle.*$/i, '').trim()
  )
}

function getMediaArtwork(): string | undefined {
  const artwork = navigator.mediaSession?.metadata?.artwork
  if (artwork && artwork.length > 0)
    return artwork[artwork.length - 1]?.src
  return undefined
}

presence.on('UpdateData', async () => {
  const [privacy, showTimestamps, showButtons, showCover] = await Promise.all([
    presence.getSetting<boolean>('privacy'),
    presence.getSetting<boolean>('timestamps'),
    presence.getSetting<boolean>('buttons'),
    presence.getSetting<boolean>('cover'),
  ])

  const { hostname, pathname, href } = document.location

  if (hostname === 'areena.yle.fi') {
    const video = document.querySelector<HTMLVideoElement>('video')
    const isPodcast = pathname.startsWith('/podcastit')
    const hasMedia
      = !!video && video.readyState > 0 && !Number.isNaN(video.duration)

    if (video && hasMedia && !privacy) {
      const isLive = video.duration === Number.POSITIVE_INFINITY
      const artist = navigator.mediaSession?.metadata?.artist

      const presenceData: PresenceData = {
        name: 'Yle Areena',
        type: isPodcast ? ActivityType.Listening : ActivityType.Watching,
        largeImageKey: ActivityAssets.Areena,
        details: getMediaTitle() || 'Yle Areena',
      }

      if (artist)
        presenceData.state = artist

      if (showCover) {
        const artwork = getMediaArtwork()
        if (artwork)
          presenceData.largeImageKey = artwork
      }

      if (isLive) {
        presenceData.smallImageKey = Assets.Live
        presenceData.smallImageText = 'Live'
      }
      else if (video.paused) {
        presenceData.smallImageKey = Assets.Pause
        presenceData.smallImageText = 'Paused'
      }
      else {
        presenceData.smallImageKey = Assets.Play
        presenceData.smallImageText = 'Playing'
        if (showTimestamps) {
          const now = Math.floor(Date.now() / 1000)
          presenceData.startTimestamp = now - Math.floor(video.currentTime)
          presenceData.endTimestamp
            = now + Math.floor(video.duration - video.currentTime)
        }
      }

      if (showButtons) {
        presenceData.buttons = [
          {
            label: isPodcast ? 'Listen on Yle Areena' : 'Watch on Yle Areena',
            url: href,
          },
        ]
      }

      presence.setActivity(presenceData)
      return
    }

    const presenceData: PresenceData = {
      name: 'Yle Areena',
      largeImageKey: ActivityAssets.Areena,
      startTimestamp: browsingTimestamp,
    }

    if (privacy) {
      presenceData.details = isPodcast
        ? 'Listening to a podcast'
        : 'Watching Yle Areena'
    }
    else {
      presenceData.details = 'Browsing Yle Areena'
      if (pathname.startsWith('/podcastit'))
        presenceData.details = 'Browsing podcasts'
      else if (pathname.startsWith('/tv/opas'))
        presenceData.details = 'Viewing the TV guide'
      else if (pathname.startsWith('/hae'))
        presenceData.details = 'Searching Yle Areena'
      presenceData.smallImageKey = Assets.Search
    }

    presence.setActivity(presenceData)
    return
  }

  if (pathname.startsWith('/abitreenit')) {
    const presenceData: PresenceData = {
      name: 'Yle Abitreenit',
      largeImageKey: ActivityAssets.Abitreenit,
      startTimestamp: browsingTimestamp,
    }

    if (privacy) {
      presenceData.details = 'Studying on Abitreenit'
    }
    else {
      presenceData.details = 'Practicing for the matriculation exams'
      const heading = document.querySelector('h1')?.textContent?.trim()
      if (heading && heading.toLowerCase() !== 'abitreenit')
        presenceData.state = heading
      if (showButtons) {
        presenceData.buttons = [
          {
            label: 'Open Abitreenit',
            url: href,
          },
        ]
      }
    }

    presence.setActivity(presenceData)
    return
  }

  if (pathname.startsWith('/v/')) {
    const video = document.querySelector<HTMLVideoElement>('video')
    const hasMedia
      = !!video && video.readyState > 0 && !Number.isNaN(video.duration)

    const presenceData: PresenceData = {
      name: 'Yle',
      largeImageKey: ActivityAssets.Logo,
      details: 'Watching short videos',
    }

    if (!privacy) {
      const title = getMediaTitle()
      if (title)
        presenceData.state = title
      if (showCover) {
        const artwork = getMediaArtwork()
        if (artwork)
          presenceData.largeImageKey = artwork
      }

      if (video && hasMedia) {
        if (video.paused) {
          presenceData.smallImageKey = Assets.Pause
          presenceData.smallImageText = 'Paused'
        }
        else {
          presenceData.smallImageKey = Assets.Play
          presenceData.smallImageText = 'Playing'
          if (showTimestamps && video.duration !== Number.POSITIVE_INFINITY) {
            const now = Math.floor(Date.now() / 1000)
            presenceData.startTimestamp = now - Math.floor(video.currentTime)
            presenceData.endTimestamp
              = now + Math.floor(video.duration - video.currentTime)
          }
        }
      }

      if (showButtons) {
        presenceData.buttons = [
          {
            label: 'Watch Video',
            url: href,
          },
        ]
      }
    }

    presence.setActivity(presenceData)
    return
  }

  // yle.fi — news site
  const newsVideo = document.querySelector<HTMLVideoElement>('video')
  if (
    !privacy
    && newsVideo
    && newsVideo.readyState > 0
    && !Number.isNaN(newsVideo.duration)
    && !newsVideo.paused
    && newsVideo.currentTime > 0
  ) {
    const presenceData: PresenceData = {
      name: 'Yle',
      largeImageKey: ActivityAssets.Logo,
      details: 'Watching short videos',
      smallImageKey: Assets.Play,
      smallImageText: 'Playing',
    }

    const title = getMediaTitle()
    if (title)
      presenceData.state = title

    if (showCover) {
      const artwork = getMediaArtwork()
      if (artwork)
        presenceData.largeImageKey = artwork
    }

    if (showTimestamps && newsVideo.duration !== Number.POSITIVE_INFINITY) {
      const now = Math.floor(Date.now() / 1000)
      presenceData.startTimestamp = now - Math.floor(newsVideo.currentTime)
      presenceData.endTimestamp
        = now + Math.floor(newsVideo.duration - newsVideo.currentTime)
    }

    if (showButtons) {
      presenceData.buttons = [
        {
          label: 'Watch Video',
          url: href,
        },
      ]
    }

    presence.setActivity(presenceData)
    return
  }

  const presenceData: PresenceData = {
    largeImageKey: ActivityAssets.Logo,
    startTimestamp: browsingTimestamp,
  }

  const headline = document
    .querySelector('article h1')
    ?.textContent
    ?.trim()

  if (privacy) {
    presenceData.details = 'Reading Yle News'
  }
  else if (pathname.startsWith('/uutiset/lyhyesti')) {
    presenceData.details = 'Reading short news'
    presenceData.smallImageKey = Assets.Reading
  }
  else if (headline) {
    presenceData.details = 'Reading an article'
    presenceData.state = headline
    presenceData.smallImageKey = Assets.Reading
    if (showButtons) {
      presenceData.buttons = [
        {
          label: 'Read Article',
          url: href,
        },
      ]
    }
  }
  else {
    presenceData.details = 'Browsing Yle News'
  }

  presence.setActivity(presenceData)
})
