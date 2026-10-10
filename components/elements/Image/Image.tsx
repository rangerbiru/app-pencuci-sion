import { Image as ExpoImage, ImageContentFit, ImageProps as ExpoImageProps } from 'expo-image';
import { StyleProp, ImageStyle, ImageSourcePropType } from 'react-native';

export interface ImageProps extends Omit<ExpoImageProps, 'source' | 'placeholder' | 'style'> {
  source: ImageSourcePropType;
  placeholder?: ImageSourcePropType;
  contentFit?: ImageContentFit;
  transition?: number;
  style?: StyleProp<ImageStyle>;
  onTouchStart?: () => void;
}

/**
 * expo-image dengan cache memori + disk (foto timbangan dan bukti tidak diunduh ulang saat daftar
 * digulir atau layar dibuka lagi). `recyclingKey` = alamat foto, supaya baris yang didaur ulang
 * FlashList tidak sempat menampilkan foto baris lain.
 */
function Image({ transition, contentFit, cachePolicy, recyclingKey, ...others }: ImageProps) {
  const uri =
    typeof others.source === 'object' && others.source && 'uri' in others.source
      ? others.source.uri
      : undefined;
  return (
    <ExpoImage
      transition={transition ?? 0}
      contentFit={contentFit ?? 'contain'}
      cachePolicy={cachePolicy ?? 'memory-disk'}
      recyclingKey={recyclingKey ?? uri}
      {...others}
    />
  );
}

export default Image;
