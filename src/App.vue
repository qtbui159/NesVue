<template>
  <div id="screen">
    <canvas id="canvas" width="256" height="240"></canvas>
    <button @click="draw">aa</button>
    <button @click="draw2">bb</button>
    <button @click="draw3">cc</button>
    <button @click="loadNesRom">bb</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, Ref, ref } from 'vue'
import JoyStickKey from './nes/Common/JoyStickKey'
import INes from './nes/INes'
import Nes from './nes/Nes'
import MiscUtils from './nes/Utils/MiscUtils'
import nestestRom from './rom/nestest'
import marioRom from './rom/mario'

export default defineComponent({
  name: 'App',
  setup () {
    const ctx: Ref<CanvasRenderingContext2D | null> = ref(null)
    let imageData: ImageData | null = null
    const nes: INes = new Nes()

    onMounted(() => {
      const canvas: HTMLCanvasElement = document.getElementById(
        'canvas'
      ) as HTMLCanvasElement

      const tmp: CanvasRenderingContext2D | null = canvas.getContext('2d')
      if (tmp) {
        ctx.value = tmp
        imageData = ctx.value.createImageData(256, 240)
      }

      nes.setRenderCallback(render)
    })

    async function draw (): Promise<void> {
      nes.p1SendKey(JoyStickKey.select, true)
      await MiscUtils.sleepAsync(300)
      nes.p1SendKey(JoyStickKey.select, false)
    }

    async function draw2 (): Promise<void> {
      nes.p1SendKey(JoyStickKey.start, true)
      await MiscUtils.sleepAsync(300)
      nes.p1SendKey(JoyStickKey.start, false)
    }

    async function draw3 (): Promise<void> {
      nes.p1SendKey(JoyStickKey.right, true)
      await MiscUtils.sleepAsync(300)
      nes.p1SendKey(JoyStickKey.right, false)
    }

    async function loadNesRom (): Promise<void> {
      nes.insertCartridge(marioRom)
      await nes.powerUp()
    }

    function render (rgb: number[]): void {
      if (ctx.value == null || imageData == null) {
        return
      }
      let j = 0
      for (let i = 0, count = rgb.length; i < count; i += 3) {
        imageData.data[j++] = rgb[i]
        imageData.data[j++] = rgb[i + 1]
        imageData.data[j++] = rgb[i + 2]
        imageData.data[j++] = 0xff
      }

      ctx.value.putImageData(imageData, 0, 0)
    }

    return { ctx, draw, draw2, draw3, loadNesRom, render }
  }
})
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

body {
  margin: 0;
}

#screen {
  width: 100vw;
  height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
